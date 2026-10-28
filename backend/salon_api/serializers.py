from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Appointment, EmployeeLog, Service, Transaction

CustomUser = get_user_model()


class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "password",
        )
        read_only_fields = ("id", "role")

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = self.Meta.model(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attribute, value in validated_data.items():
            setattr(instance, attribute, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"


class AppointmentSerializer(serializers.ModelSerializer):
    total_duration = serializers.IntegerField(read_only=True)
    total_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = Appointment
        fields = (
            "id",
            "client",
            "employee",
            "services",
            "status",
            "scheduled_at",
            "total_duration",
            "total_price",
        )
        read_only_fields = ("id", "client", "total_duration", "total_price")

    def validate_employee(self, employee):
        if employee and employee.role != CustomUser.Role.EMPLOYEE:
            raise serializers.ValidationError("The assigned user must have the employee role.")
        return employee

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.user
        return super().create(validated_data)


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = (
            "id",
            "transaction_type",
            "amount",
            "description",
            "date",
            "employee",
        )
        read_only_fields = ("id", "date", "employee")

    def validate_amount(self, amount):
        if amount <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return amount


class EmployeeLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeLog
        fields = (
            "id",
            "employee",
            "client_name",
            "services_rendered",
            "payment_collected",
            "created_at",
        )
        read_only_fields = ("id", "employee", "created_at")

    def validate_payment_collected(self, amount):
        if amount < 0:
            raise serializers.ValidationError("Payment cannot be negative.")
        return amount

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["employee"] = request.user
        return super().create(validated_data)
