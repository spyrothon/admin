require "kemal"

public_folder "./"


SOCKETS = [] of HTTP::WebSocket

ws "/timer-control" do |socket|
  # Add the client to SOCKETS list
  SOCKETS << socket
  # Broadcast each message to all clients
  socket.on_message do |message|
    puts "#{Time.now} #{message}"
    SOCKETS.each{ |socket| socket.send(message) }
  end
  # Remove clients from the list when it’s closed
  socket.on_close{ SOCKETS.delete(socket) }
end

get "/admin" do |ctx|
  render "admin.html.ecr"
end

get "/timer" do |ctx|
  render "timer.html.ecr"
end


Kemal.run
