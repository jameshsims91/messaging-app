class User < ApplicationRecord
  has_secure_password

  has_many :conversation_memberships, dependent: :destroy
  has_many :conversations, through: :conversation_memberships
  has_many :messages, dependent: :destroy

  normalizes :username, :email, with: ->(value) { value.strip.downcase }

  validates :username,
    presence: true,
    uniqueness: true,
    length: { in: 3..30 },
    format: {
      with: /\A[a-z0-9_]+\z/,
      message: "can only contain letters, numbers, and underscores"
    }

  validates :email,
    presence: true,
    uniqueness: true,
    length: { maximum: 254 },
    format: { with: URI::MailTo::EMAIL_REGEXP }

  validates :display_name, presence: true, length: { maximum: 50 }
  validates :bio, length: { maximum: 500 }

  validates :password,
    length: { minimum: 12 },
    if: -> { password.present? }
end
