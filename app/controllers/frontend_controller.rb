class FrontendController < ApplicationController
  def index
    response.headers["Cache-Control"] = "no-store"

    send_file Rails.root.join("public", "frontend", "index.html"),
      type: "text/html",
      disposition: "inline"
  end
end
