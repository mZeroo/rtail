### 1. Introduce

Tail remote log in your local box. For example, if you want to see the tatooine-error.log on the server01, you can run the command like this:

	rtail server01 -f tatooine-error.log // tail
	
	rtail server01 -1000f tatooine-error.log | grep Exception // tail and grep


rtail contains three components：

* rtail-slave
	1. Run this ```tail``` command on server and send to result to client.
	2. Send registration message(like: address, filenames) to rtail-server every one munite.
* rtail-server：
	1. Accept the registration message from rtail-slave. If rtail-server does not recive the heartbeat from rtail-slave, it will the rtail-slave is unavailable.
	2. Tell the information of rtail-slave to client.
* rtail：
	1. Get the `tail` result and show it in the terminal.

---

                                          logs/socket.io                                      
                 +---------------------------------------------------------------------------+
                 |                                                           +------------+  |
                 |                                                   +------>|   rtail1   |<-+
      +--------------------+  config                                 |       +------------+   
      |    rtail-slave1    |/socket.io                               |                        
      |/opt/logs/access.log|--------+                                |                        
      |/opt/logs/error.log |        |                                |config/socket.io        
      +--------------------+        |        +----------------+      |                        
                                    |        |                |      |                        
                                    +------->| rtail-server   |------+                        
                                    |        |                |      |                        
      +--------------------+        |        +----------------+      |                        
      |    rtail-slave2    |        |                                |                        
      |/opt/logs/access.log|--------+                                |config/socket.io        
      |/opt/logs/error.log |  config                                 |                        
      +--------------------+/socket.io                               |       +------------+   
                 |                                                   +------>|   rtail2   |<-+
                 |                                                           +------------+  |
                 +---------------------------------------------------------------------------+
                                             logs/socket.io                                   
                                                                                  

*More detail you can refer to [why rtail](http://mzeroo.github.io/2015/10/10/tail-f-log.html).*

### 2. ENV Install

1. install node [link](https://nodejs.org/en/download/)
	
2. install dependencies

		cd client or server or config
		npm install	

### 3. Client Usage

1. list all hosts
	
		./client/rtail.js -host # list all hosts

2. list all logs on host 
		
		./client/rtail.js $host -log # list all logs on $host

3. tail -f log 
		
		./client/rtail.js $host -f $log # tail -f one log, support all tail options


### 4. Server Usage

1. start

		./server/rtail-server.js -p 8410
		
		
### 5. Slave Usage

1. start

		./config/rtail-slave -p 8411