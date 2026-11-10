module Api
  class ProfilesController < BaseController
    def show
      render json: { user: user_json(current_user) }
    end

    def update
      if current_user.update(profile_params)
        render json: { user: user_json(current_user) }
      else
        render json: { errors: current_user.errors.full_messages },
          status: :unprocessable_entity
      end
    end

    private

    def profile_params
      params.require(:user).permit(:display_name, :bio)
    end
  end
end
