from datetime import timedelta
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Appointment, CustomUser, EmployeeLog, Service, Transaction


class SalonApiTests(APITestCase):
    def setUp(self):
        self.client_user = CustomUser.objects.create_user(
            username="client",
            password="client-password",
            role=CustomUser.Role.CLIENT,
        )
        self.employee = CustomUser.objects.create_user(
            username="stylist",
            password="employee-password",
            role=CustomUser.Role.EMPLOYEE,
        )
        self.admin = CustomUser.objects.create_user(
            username="owner",
            password="admin-password",
            role=CustomUser.Role.ADMIN,
        )
        self.service = Service.objects.create(
            name="Signature cut",
            category=Service.Category.HAIR,
            duration_minutes=45,
            price=Decimal("60.00"),
        )

    def test_services_are_publicly_readable_but_not_publicly_editable(self):
        response = self.client.get(reverse("service-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["name"], "Signature cut")

        response = self.client.post(
            reverse("service-list"),
            {"name": "New service"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(
            reverse("service-list"),
            {"name": "Unauthorized service"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_appointment_response_includes_read_only_totals(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(
            reverse("appointment-list"),
            {
                "services": [self.service.pk],
                "scheduled_at": (timezone.now() + timedelta(days=1)).isoformat(),
                "total_duration": 999,
                "total_price": "1.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["total_duration"], 45)
        self.assertEqual(response.data["total_price"], "60.00")
        appointment = Appointment.objects.get(pk=response.data["id"])
        self.assertEqual(appointment.client, self.client_user)

    def test_employee_logs_are_created_for_authenticated_employee(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.post(
            reverse("employee-log-list"),
            {
                "client_name": "Walk-in client",
                "services_rendered": [self.service.pk],
                "payment_collected": "60.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["employee"], self.employee.pk)
        self.assertEqual(EmployeeLog.objects.get(pk=response.data["id"]).employee, self.employee)

    def test_analytics_aggregates_income_expenses_and_employee_logs(self):
        Transaction.objects.create(
            transaction_type=Transaction.Type.INCOME,
            amount=Decimal("150.00"),
            description="Service revenue",
        )
        Transaction.objects.create(
            transaction_type=Transaction.Type.EXPENSE,
            amount=Decimal("30.00"),
            description="Supplies",
        )
        Transaction.objects.create(
            transaction_type=Transaction.Type.SALARY,
            amount=Decimal("20.00"),
            description="Salary payout",
        )
        EmployeeLog.objects.create(
            employee=self.employee,
            client_name="Walk-in client",
            payment_collected=Decimal("55.00"),
        ).services_rendered.add(self.service)

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("transaction-analytics"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data["total_income"]), Decimal("150.00"))
        self.assertEqual(Decimal(response.data["total_expense"]), Decimal("50.00"))
        self.assertEqual(Decimal(response.data["net_profit"]), Decimal("100.00"))
        self.assertEqual(len(response.data["weekly_trends"]), 1)
        self.assertEqual(response.data["employee_performance"][0]["clients_served"], 1)
        self.assertEqual(
            Decimal(response.data["employee_performance"][0]["money_collected"]),
            Decimal("55.00"),
        )

    def test_transactions_are_not_available_to_non_admin_users(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get(reverse("transaction-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_token_login_returns_token_and_role_for_username_or_email(self):
        response = self.client.post(
            reverse("api-token-login"),
            {"username": "stylist", "password": "employee-password"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["token"])
        self.assertEqual(response.data["user"]["role"], CustomUser.Role.EMPLOYEE)

        self.client_user.email = "client@example.com"
        self.client_user.save(update_fields=["email"])
        response = self.client.post(
            reverse("api-token-login"),
            {"username": "client@example.com", "password": "client-password"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["role"], CustomUser.Role.CLIENT)

    def test_token_authentication_authorizes_employee_portal_api(self):
        login = self.client.post(
            reverse("api-token-login"),
            {"username": "stylist", "password": "employee-password"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login.data['token']}")
        response = self.client.get(reverse("employee-log-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_endpoint_accepts_email_and_returns_role_and_token(self):
        self.client_user.email = "client@example.com"
        self.client_user.save(update_fields=["email"])

        response = self.client.post(
            reverse("api-login"),
            {"email": "client@example.com", "password": "client-password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["id"], self.client_user.pk)
        self.assertEqual(response.data["user"]["username"], "client")
        self.assertEqual(response.data["user"]["role"], CustomUser.Role.CLIENT)
        self.assertTrue(response.data["token"])

    def test_admin_can_create_employee_account_with_hashed_password(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("employee-create"),
            {
                "username": "new-stylist",
                "email": "new-stylist@example.com",
                "password": "Long-Unique-Password-938!",
                "first_name": "New",
                "last_name": "Stylist",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["role"], CustomUser.Role.EMPLOYEE)
        employee = CustomUser.objects.get(username="new-stylist")
        self.assertTrue(employee.check_password("Long-Unique-Password-938!"))
        self.assertNotEqual(employee.password, "Long-Unique-Password-938!")

    def test_non_admin_cannot_create_employee_account(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.post(
            reverse("employee-create"),
            {
                "username": "unauthorized-stylist",
                "email": "unauthorized@example.com",
                "password": "Long-Unique-Password-938!",
                "first_name": "Unauthorized",
                "last_name": "Stylist",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
