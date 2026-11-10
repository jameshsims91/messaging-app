class Conversation < ApplicationRecord
  has_many :conversation_memberships, dependent: :destroy
  has_many :users, through: :conversation_memberships
  has_many :messages, dependent: :destroy

  validates :direct_key, presence: true, uniqueness: true

  def self.direct_between!(first_user, second_user)
    if first_user.id == second_user.id
      raise ArgumentError, "Choose another user."
    end

    key = [ first_user.id, second_user.id ].sort.join(":")

    create_or_find_by!(direct_key: key) do |conversation|
      conversation.conversation_memberships.build(user: first_user)
      conversation.conversation_memberships.build(user: second_user)
    end
  end
end
