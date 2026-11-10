Rails.application.routes.draw do
  root "frontend#index"

  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resource :csrf, only: :show, controller: "csrf"
    resource :registration, only: :create
    resource :session, only: [ :show, :create, :destroy ]
    resource :profile, only: [ :show, :update ]

    resources :users, only: :index

    resources :conversations, only: [ :index, :show, :create ] do
      resources :messages, only: [ :index, :create ]
    end
  end
end
