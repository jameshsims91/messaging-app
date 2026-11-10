module Api
  class RegistrationsController < BaseController
    skip_before_action :require_login, only: :create

    def create
      user = User.new(registration_params)

      if user.save
        reset_session
        session[:user_id] = user.id

        render json: {
          user: user_json(user),
          csrf_token: form_authenticity_token
        }, status: :created
      else
        render json: { errors: user.errors.full_messages },
          status: :unprocessable_entity
      end
    end

    private

    def registration_params
      params.require(:user).permit(
        :username,
        :email,
        :display_name,
        :password,
        :password_confirmation
      )
    end
  end
end
