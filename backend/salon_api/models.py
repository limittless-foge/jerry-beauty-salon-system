from decimal import Decimal

from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        EMPLOYEE = "employee", "Employee"
        CLIENT = "client", "Client"

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CLIENT,
    )

    def __str__(self):
        return self.get_full_name() or self.username


class Service(models.Model):
    class Category(models.TextChoices):
        HAIR = "hair", "Hair"
        NAIL = "nail", "Nail"
        HENNA = "henna", "Henna"
        MAKEUP = "makeup", "Makeup"
        EYEBROW = "eyebrow", "Eyebrow"

    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=Category.choices)
    duration_minutes = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    treatment_guidelines = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        CONFIRMED = "Confirmed", "Confirmed"
        COMPLETED = "Completed", "Completed"
        CANCELLED = "Cancelled", "Cancelled"

    client = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="client_appointments",
        limit_choices_to={"role": CustomUser.Role.CLIENT},
    )
    employee = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        related_name="employee_appointments",
        limit_choices_to={"role": CustomUser.Role.EMPLOYEE},
        null=True,
        blank=True,
    )
    services = models.ManyToManyField(Service, related_name="appointments")
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    scheduled_at = models.DateTimeField()

    @property
    def total_duration(self):
        if not self.pk:
            return 0
        return sum(service.duration_minutes for service in self.services.all())

    @property
    def total_price(self):
        if not self.pk:
            return Decimal("0.00")
        return sum(
            (service.price for service in self.services.all()),
            start=Decimal("0.00"),
        )

    def __str__(self):
        return f"Appointment {self.pk or 'unsaved'}"


class Transaction(models.Model):
    class Type(models.TextChoices):
        INCOME = "income", "Income"
        EXPENSE = "expense", "Expense"
        SALARY = "salary", "Salary"

    transaction_type = models.CharField(max_length=10, choices=Type.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    employee = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        related_name="transactions",
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.amount}"


class EmployeeLog(models.Model):
    employee = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="employee_logs",
    )
    client_name = models.CharField(max_length=150)
    services_rendered = models.ManyToManyField(Service, related_name="employee_logs")
    payment_collected = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee} - {self.client_name or 'Walk-in'}"
