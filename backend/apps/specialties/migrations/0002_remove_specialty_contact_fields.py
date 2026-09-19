from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("specialties", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="specialty",
            name="email",
        ),
        migrations.RemoveField(
            model_name="specialty",
            name="phone",
        ),
    ]
