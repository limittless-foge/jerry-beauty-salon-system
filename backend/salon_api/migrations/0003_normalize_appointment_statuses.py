from django.db import migrations


def normalize_appointment_statuses(apps, schema_editor):
    Appointment = apps.get_model("salon_api", "Appointment")
    status_mapping = {
        "scheduled": "Pending",
        "confirmed": "Confirmed",
        "completed": "Completed",
        "cancelled": "Cancelled",
    }
    for old_status, new_status in status_mapping.items():
        Appointment.objects.filter(status=old_status).update(status=new_status)


def restore_appointment_statuses(apps, schema_editor):
    Appointment = apps.get_model("salon_api", "Appointment")
    status_mapping = {
        "Pending": "scheduled",
        "Confirmed": "confirmed",
        "Completed": "completed",
        "Cancelled": "cancelled",
    }
    for new_status, old_status in status_mapping.items():
        Appointment.objects.filter(status=new_status).update(status=old_status)


class Migration(migrations.Migration):
    dependencies = [
        ("salon_api", "0002_rename_datetime_appointment_scheduled_at_and_more"),
    ]

    operations = [
        migrations.RunPython(
            normalize_appointment_statuses,
            restore_appointment_statuses,
        ),
    ]
