from rest_framework.permissions import BasePermission

from .models import CustomUser


def is_salon_admin(user):
    return user.is_authenticated and (user.is_staff or user.role == CustomUser.Role.ADMIN)


class IsSalonAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_salon_admin(request.user)


class IsSalonAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in ("GET", "HEAD", "OPTIONS") or is_salon_admin(request.user)


class IsEmployeeOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                is_salon_admin(user)
                or user.role == CustomUser.Role.EMPLOYEE
            )
        )
