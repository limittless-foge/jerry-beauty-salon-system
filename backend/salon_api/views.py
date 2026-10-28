from datetime import timedelta

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncWeek
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token

from .models import Appointment, CustomUser, EmployeeLog, Service, Transaction
from .permissions import (
    IsEmployeeOrAdmin,
    IsSalonAdmin,
    IsSalonAdminOrReadOnly,
    is_salon_admin,
)
from .serializers import (
    AppointmentSerializer,
    EmployeeLogSerializer,
    ServiceSerializer,
    TransactionSerializer,
)

CustomUserModel = get_user_model()


class TokenLoginView(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def post(self, request):
        username = (
            request.data.get("username")
            or request.data.get("email")
            or request.data.get("identifier")
            or ""
        ).strip()
        password = request.data.get("password", "")
        if not username or not password:
            return Response(
                {
                    "detail": "Username/email and password are required.",
                    "error": "Username/email and password are required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)
        if user is None and "@" in username:
            account = CustomUserModel.objects.filter(email__iexact=username).first()
            if account:
                user = authenticate(
                    request,
                    username=account.get_username(),
                    password=password,
                )

        if user is None:
            return Response(
                {
                    "detail": "Invalid username/email or password.",
                    "error": "Invalid credentials",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": {
                    "id": user.pk,
                    "username": user.get_username(),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                },
            }
        )


class EmployeeCreateView(APIView):
    permission_classes = (IsSalonAdmin,)

    def post(self, request):
        required_fields = ("username", "email", "password", "first_name", "last_name")
        missing_fields = [
            field for field in required_fields
            if not isinstance(request.data.get(field), str) or not request.data[field].strip()
        ]
        if missing_fields:
            return Response(
                {field: ["This field is required."] for field in missing_fields},
                status=status.HTTP_400_BAD_REQUEST,
            )

        username = request.data["username"].strip()
        email = request.data["email"].strip()
        if CustomUserModel.objects.filter(username__iexact=username).exists():
            return Response(
                {"username": ["A user with that username already exists."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if CustomUserModel.objects.filter(email__iexact=email).exists():
            return Response(
                {"email": ["A user with that email already exists."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        employee_data = {
            "username": username,
            "email": email,
            "first_name": request.data["first_name"].strip(),
            "last_name": request.data["last_name"].strip(),
        }
        for field in ("username", "email", "first_name", "last_name"):
            try:
                CustomUserModel._meta.get_field(field).run_validators(employee_data[field])
            except DjangoValidationError as error:
                return Response({field: list(error.messages)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_password(request.data["password"], user=CustomUserModel(**employee_data))
        except DjangoValidationError as error:
            return Response(
                {"password": list(error.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = CustomUserModel.objects.create_user(
            username=username,
            email=email,
            password=request.data["password"],
            first_name=employee_data["first_name"],
            last_name=employee_data["last_name"],
            role=CustomUser.Role.EMPLOYEE,
        )
        return Response(
            {
                "id": user.pk,
                "username": user.get_username(),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
            },
            status=status.HTTP_201_CREATED,
        )


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all().order_by("category", "name")
    serializer_class = ServiceSerializer
    permission_classes = (IsSalonAdminOrReadOnly,)


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = Appointment.objects.select_related("client", "employee").prefetch_related("services")
        user = self.request.user
        if user.is_staff or user.role == CustomUser.Role.ADMIN:
            return queryset
        if user.role == CustomUser.Role.EMPLOYEE:
            return queryset.filter(employee=user)
        return queryset.filter(client=user)


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.select_related("employee").order_by("-date")
    serializer_class = TransactionSerializer
    permission_classes = (IsSalonAdmin,)

    @action(detail=False, methods=["get"])
    def analytics(self, request):
        transactions = Transaction.objects.all()
        totals = transactions.aggregate(
            total_income=Sum(
                "amount",
                filter=Q(transaction_type=Transaction.Type.INCOME),
            ),
            total_expense=Sum(
                "amount",
                filter=Q(transaction_type__in=[
                    Transaction.Type.EXPENSE,
                    Transaction.Type.SALARY,
                ]),
            ),
        )
        income = totals["total_income"] or 0
        expense = totals["total_expense"] or 0

        today = timezone.localdate()
        week_start = today - timedelta(days=today.weekday() + 7 * 11)
        weekly_trends = list(
            transactions.filter(date__date__gte=week_start)
            .annotate(week=TruncWeek("date"))
            .values("week")
            .annotate(
                income=Sum(
                    "amount",
                    filter=Q(transaction_type=Transaction.Type.INCOME),
                ),
                expense=Sum(
                    "amount",
                    filter=Q(transaction_type__in=[
                        Transaction.Type.EXPENSE,
                        Transaction.Type.SALARY,
                    ]),
                ),
            )
            .order_by("week")
        )
        trend_data = [
            {
                "week": item["week"].date().isoformat(),
                "period": item["week"].date().isoformat(),
                "income": item["income"] or 0,
                "expense": item["expense"] or 0,
                "revenue": item["income"] or 0,
                "expenses": item["expense"] or 0,
            }
            for item in weekly_trends
        ]

        employee_performance = list(
            EmployeeLog.objects.values(
                "employee_id",
                "employee__first_name",
                "employee__last_name",
                "employee__username",
            )
            .annotate(
                clients_served=Count("id"),
                money_collected=Sum("payment_collected"),
            )
            .order_by("employee__username")
        )
        employee_data = [
            {
                "employee_id": item["employee_id"],
                "employee_name": (
                    f"{item['employee__first_name']} {item['employee__last_name']}".strip()
                    or item["employee__username"]
                ),
                "clients_served": item["clients_served"],
                "money_collected": item["money_collected"] or 0,
                "revenue": item["money_collected"] or 0,
            }
            for item in employee_performance
        ]

        return Response(
            {
                "total_income": income,
                "total_expense": expense,
                "net_profit": income - expense,
                "pending_salaries": None,
                "weekly_trends": trend_data,
                "employee_performance": employee_data,
                "total_revenue": income,
                "total_expenses": expense,
                "revenue_expense_trend": trend_data,
            }
        )


class EmployeeLogViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeLogSerializer
    permission_classes = (IsEmployeeOrAdmin,)

    def get_queryset(self):
        queryset = EmployeeLog.objects.select_related("employee").prefetch_related("services_rendered")
        if is_salon_admin(self.request.user):
            return queryset
        return queryset.filter(employee=self.request.user)
