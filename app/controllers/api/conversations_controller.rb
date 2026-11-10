module Api
  class ConversationsController < BaseController
    def index
      conversations = current_user.conversations
        .includes(:users)
        .order(updated_at: :desc, id: :desc)

      render json: {
        conversations: conversations.map do |conversation|
          conversation_json(conversation)
        end
      }
    end

    def show
      conversation = current_user.conversations
        .includes(:users)
        .find(params[:id])

      render json: {
        conversation: conversation_json(conversation)
      }
    end

    def create
      recipient = User.find(params.require(:recipient_id))

      if recipient.id == current_user.id
        render json: { error: "Choose another user." },
          status: :unprocessable_entity
        return
      end

      key = [ current_user.id, recipient.id ].sort.join(":")

      conversation = Conversation.find_by(direct_key: key) ||
        Conversation.direct_between!(current_user, recipient)

      render json: {
        conversation: conversation_json(conversation)
      }
    end

    private

    def conversation_json(conversation)
      {
        id: conversation.id,
        updated_at: conversation.updated_at,
        participants: conversation.users.map { |user| user_json(user) }
      }
    end
  end
end
