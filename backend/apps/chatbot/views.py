from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .gemini import GeminiError, generate_answer
from .knowledge import load_approved_knowledge
from .safety import PolicyAction, classify_message


class ChatbotMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000, allow_blank=False, trim_whitespace=True)


class ChatbotMessageView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = ChatbotMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.validated_data["message"]

        decision = classify_message(message)
        policy = {
            "category": decision.category.value,
            "action": decision.action.value,
        }
        if decision.action != PolicyAction.ALLOW:
            return Response(
                {"answer": decision.response, "source": "policy", "policy": policy}
            )

        try:
            answer = generate_answer(message, load_approved_knowledge())
        except GeminiError:
            return Response(
                {"detail": "Chatbot hiện chưa sẵn sàng. Vui lòng thử lại sau."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({"answer": answer, "source": "gemini", "policy": policy})
