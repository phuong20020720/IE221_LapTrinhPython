# Generated manually for User.role CheckConstraint

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="user",
            constraint=models.CheckConstraint(
                condition=models.Q(role__in=["ADMIN", "EMPLOYEE"]),
                name="users_role_valid",
            ),
        ),
    ]
