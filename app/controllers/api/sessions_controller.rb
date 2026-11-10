module Api
  class SessionsController < BaseController
    skip_before_action :require_login, only: :create

    def show
      response.headers["Cache-Control"] = "no-store"

      render json: { user: user_json(current_user) }
    end

    def create
      email = params[:email].to_s.strip.downcase
      user = User.find_by(email: email)

      if user&.authenticate(params[:password].to_s)
        reset_session
        session[:user_id] = user.id

        render json: {
          user: user_json(user),
          csrf_token: form_authenticity_token
        }
      else
        render json: { error: "Invalid email or password." },
          status: :unauthorized
      end
    end

    def destroy
      reset_session

      render json: {
        message: "Logged out successfully.",
        csrf_token: form_authenticity_token
      }
    end
  end
end
