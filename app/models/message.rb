class Message < ApplicationRecord
  belongs_to :user
  belongs_to :conversation, touch: true

  validates :body, presence: true, length: { maximum: 5_000 }
  validate :sender_belongs_to_conversation

  private

  def sender_belongs_to_conversation
    return unless user && conversation

    unless conversation.conversation_memberships.exists?(user_id: user.id)
      errors.add(:user, "must belong to the conversation")
    end
  end
end
