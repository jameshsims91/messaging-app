module Api
  class MessagesController < BaseController
    before_action :set_conversation

    def index
      messages = @conversation.messages

      if params[:before_id].present?
        cursor = Integer(params[:before_id].to_s, 10)
        messages = messages.where("id < ?", cursor)
      end

      messages = messages.includes(:user).order(id: :desc).limit(50).to_a

      render json: {
        messages: messages.reverse.map { |message| message_json(message) },
        next_before_id: messages.last&.id
      }
    rescue ArgumentError
      render json: { error: "Invalid message cursor." },
        status: :bad_request
    end

    def create
      message = @conversation.messages.build(message_params)
      message.user = current_user

      if message.save
        render json: { message: message_json(message) },
          status: :created
      else
        render json: { errors: message.errors.full_messages },
          status: :unprocessable_entity
      end
    end

    private

    def set_conversation
      @conversation = current_user.conversations.find(
        params[:conversation_id]
      )
    end

    def message_params
      params.require(:message).permit(:body)
    end
  end
end
