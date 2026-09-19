from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """Phân trang chuẩn cho mọi list endpoint của MediBook."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100
