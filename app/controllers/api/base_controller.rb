module Api
  class BaseController < ApplicationController
    before_action :require_login

    rescue_from ActionController::InvalidAuthenticityToken do
      render json: { error: "Invalid security token. Refresh and try again." },
        status: :unprocessable_entity
    end

    rescue_from ActiveRecord::RecordNotFound do
      render json: { error: "Not found." }, status: :not_found
    end

    rescue_from ActiveRecord::RecordInvalid do |exception|
      render json: { errors: exception.record.errors.full_messages },
        status: :unprocessable_entity
    end

    private

    def current_user
      @current_user ||= User.find_by(id: session[:user_id])
    end

    def require_login
      unless current_user
        render json: { error: "You must log in first." },
          status: :unauthorized
      end
    end

    def user_json(user)
      user.as_json(
        only: [ :id, :username, :display_name, :bio ]
      )
    end

    def message_json(message)
      {
        id: message.id,
        body: message.body,
        created_at: message.created_at,
        user: user_json(message.user)
      }
    end
  end
end
