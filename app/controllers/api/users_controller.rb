module Api
  class UsersController < BaseController
    def index
      query = params[:q].to_s.strip.downcase.first(30)
      users = User.where.not(id: current_user.id)

      if query.present?
        pattern = "%#{User.sanitize_sql_like(query)}%"
        users = users.where("username LIKE ?", pattern)
      end

      users = users.order(:username).limit(20)

      render json: {
        users: users.map { |user| user_json(user) }
      }
    end
  end
end
