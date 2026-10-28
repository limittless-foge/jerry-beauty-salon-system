from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AppointmentViewSet,
    EmployeeLogViewSet,
    EmployeeCreateView,
    ServiceViewSet,
    TokenLoginView,
    TransactionViewSet,
)

router = DefaultRouter()
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"appointments", AppointmentViewSet, basename="appointment")
router.register(r"transactions", TransactionViewSet, basename="transaction")
router.register(r"employee-logs", EmployeeLogViewSet, basename="employee-log")

urlpatterns = router.urls
urlpatterns += [
    path("login/", TokenLoginView.as_view(), name="login"),
    path("login/", TokenLoginView.as_view(), name="api-login"),
    path("token/", TokenLoginView.as_view(), name="api-token-login"),
    path("employees/create/", EmployeeCreateView.as_view(), name="create-employee"),
    path("employees/create/", EmployeeCreateView.as_view(), name="employee-create"),
]
