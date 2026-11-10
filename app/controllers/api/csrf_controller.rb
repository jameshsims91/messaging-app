module Api
  class CsrfController < BaseController
    skip_before_action :require_login

    def show
      response.headers["Cache-Control"] = "no-store"

      render json: { csrf_token: form_authenticity_token }
    end
  end
end
