from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .gemini import GeminiError
from .services import MAX_HISTORY_MESSAGES, answer_chatbot_message


class ChatHistoryMessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["user", "assistant"])
    text = serializers.CharField(max_length=2000, allow_blank=False, trim_whitespace=True)


class ChatbotMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000, allow_blank=False, trim_whitespace=True)
    history = ChatHistoryMessageSerializer(
        many=True,
        required=False,
        max_length=MAX_HISTORY_MESSAGES,
    )


class ChatbotMessageView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = ChatbotMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = answer_chatbot_message(**serializer.validated_data)
        except GeminiError:
            return Response(
                {"detail": "Chatbot hiện chưa sẵn sàng. Vui lòng thử lại sau."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {
                "answer": result.answer,
                "source": result.source,
                "policy": {
                    "category": result.policy.category.value,
                    "action": result.policy.action.value,
                },
            }
        )
