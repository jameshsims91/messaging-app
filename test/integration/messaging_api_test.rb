require "test_helper"

class MessagingApiTest < ActionDispatch::IntegrationTest
  PASSWORD = "testing-password-123"

  setup do
    @james = create_user("james")
    @alex = create_user("alex")
    @taylor = create_user("taylor")

    @conversation = Conversation.direct_between!(@james, @alex)
    @message = @conversation.messages.create!(
      user: @james,
      body: "Hello, Alex!"
    )
  end

  test "private endpoints require login" do
    get "/api/conversations", as: :JSON
    assert_response :unauthorized

    get messages_path, as: :JSON
    assert_response :unauthorized

    patch "/api/profile",
      params: { user: { display_name: "Changed" } },
      as: :JSON
    assert_response :unauthorized
  end

  test "login persists and logout ends the session" do
    login_as(@james)

    get "/api/session", as: :JSON
    assert_response :success
    assert_equal @james.id, response.parsed_body.dig("user", "id")

    delete "/api/session", as: :JSON
    assert_response :success

    get "/api/session", as: :JSON
    assert_response :unauthorized
  end

  test "incorrect password does not authenticate" do
    post "/api/session",
      params: { email: @james.email, password: "incorrect" },
      as: :JSON

    assert_response :unauthorized

    get "/api/session", as: :JSON
    assert_response :unauthorized
  end

  test "outsider cannot view or send messages in a private conversation" do
    login_as(@taylor)

    get "/api/conversations/#{@conversation.id}", as: :JSON
    assert_response :not_found

    get messages_path, as: :JSON
    assert_response :not_found

    assert_no_difference "Message.count" do
      post messages_path,
        params: { message: { body: "Blocked message" } },
        as: :JSON

      assert_response :not_found
    end

    get "/api/conversations", as: :JSON
    assert_response :success
    assert_empty response.parsed_body.fetch("conversations")
  end

  test "sender comes from the session rather than submitted user ids" do
    login_as(@james)

    assert_difference "Message.count", 1 do
      post messages_path,
        params: {
          user_id: @alex.id,
          message: { body: "From James", user_id: @alex.id }
        },
        as: :json

      assert_response :created
    end

    message = Message.find(response.parsed_body.dig("message", "id"))
    assert_equal @james.id, message.user_id
    assert_equal @conversation.id, message.conversation_id
  end

  test "blank messages are rejected" do
    login_as(@james)

    assert_no_difference "Message.count" do
      post messages_path,
        params: { message: { body: "   " } },
        as: :json

      assert_response :unprocessable_entity
    end
  end

  test "profile endpoint only updates the logged in user's allowed fields" do
    login_as(@james)

    patch "/api/profile",
      params: {
        user: {
          id: @alex.id,
          display_name: "James Updated",
          bio: "My new bio",
          email: "changed@example.com"
        }
      },
      as: :json

    assert_response :success

    @james.reload
    assert_equal "James Updated", @james.display_name
    assert_equal "My new bio", @james.bio
    assert_equal "james@example.com", @james.email
    assert_equal "Alex", @alex.reload.display_name
  end

  test "opening an existing direct conversation reuses it" do
    login_as(@alex)

    assert_no_difference [ "Conversation.count", "ConversationMembership.count" ] do
      post "/api/conversations",
        params: { recipient_id: @james.id },
        as: :json

      assert_response :success
      assert_equal @conversation.id,
        response.parsed_body.dig("conversation", "id")
    end
  end

  test "message history pages do not overlap" do
    login_as(@james)

    51.times do |number|
      @conversation.messages.create!(
        user: @alex,
        body: "History #{number}"
      )
    end

    get messages_path, as: :json
    assert_response :success

    latest = response.parsed_body.fetch("messages")
    latest_ids = latest.map { |message| message.fetch("id") }

    assert_equal 50, latest_ids.length
    assert_equal latest_ids.sort, latest_ids

    get messages_path,
      params: { before_id: latest_ids.first },
      as: :json
    assert_response :success

    older_ids = response.parsed_body.fetch("messages")
      .map { |message| message.fetch("id") }

    assert_equal 2, older_ids.length
    assert_empty latest_ids & older_ids
    assert older_ids.all? { |id| id < latest_ids.first }
  end

  private

  def create_user(name)
    User.create!(
      username: name,
      email: "#{name}@example.com",
      display_name: name.capitalize,
      password: PASSWORD,
      password_confirmation: PASSWORD
    )
  end

  def login_as(user)
    post "/api/session",
      params: { email: user.email, password: PASSWORD },
      as: :json

    assert_response :success
  end

  def messages_path
    "/api/conversations/#{@conversation.id}/messages"
  end
end
