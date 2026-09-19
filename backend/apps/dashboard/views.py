from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsEmployeeOrAdmin
from apps.dashboard.serializers import DashboardPeriodQuerySerializer, DashboardSummarySerializer
from apps.dashboard.services import get_dashboard_summary


class DashboardSummaryView(APIView):
    permission_classes = [IsEmployeeOrAdmin]

    def get(self, request):
        query = DashboardPeriodQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        serializer = DashboardSummarySerializer(
            get_dashboard_summary(**query.validated_data),
        )
        return Response(serializer.data)
