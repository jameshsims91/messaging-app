class CreateConversations < ActiveRecord::Migration[8.1]
  def change
    create_table :conversations do |t|
      t.string :direct_key, null: false

      t.timestamps
    end

    add_index :conversations, :direct_key, unique: true
  end
end
