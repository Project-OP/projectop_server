# Project-OP Server
This is the server for Project-OP (OP stands for online poker).

## Production use, using an image from hub.docker.com
You can use a precompiled image from docker.io
```
docker pull docker.io/hockoloco/projectop
docker run -d -p 10401:3000 --name projectop docker.io/hockoloco/projectop:latest
```
Note that you will need HTTPS on your server.
I recommend to use an nginx reverse proxy redirecting to http://localhost:10401 and letsencrypt.


## Production use, builing from source
The server needs a compiled version of the client in
```
.
|── projectop_server/
|   |── static/(here)
```
The client must be built first, then the server.

Please view the client's README.MD to built it.

----------

To build the server for production use, you need Node-JS. A Dockerfile is also present to make a ready to use docker image.
The project structure should look as follows:

```
.
|── projectop_server/
|   |── static/
|       |── (this is the compiled projectop_webclient location)
|── projectop_webclient/
```

To compile the server, use this command:
```
npm run compile
```

If you encounter problems due to automatic version incrementation, try
```
npm run compile-nv
```

Before this can work, remember to use 
```
npm install
```
to install all dependencies.

Now the project is compiled and ready to use.

Please note that the production usage requires an HTTPS connection.
For this, I use an nginx reverse proxy and letsencrypt.
ProjectOP runs in a docker container.

The following describes how to make an auto compile and deploy infrastructure using docker, a remote server and a docker registry.
Setting up a docker registry is not included but you can use the standard docker registry for this.

-----------------

After compilation, you can make the docker image
```
docker build -t IMAGENAME:VERSION .
```
Change IMAGENAME:VERSION accordingly, e.g.
```
docker build -t mydockerregistry.com/projectop:latest .
```

You can then push it to a docker registry, if you have one.
```
docker push mydockerregistry.com/projectop
```
Change mydockerregistry.com to a working docker-registry


On the server, pull the image and run it. For this, I execute a remote script via ssh
```
ssh myserver.com /root/docker/redeployOP.sh

```
On the server, the `redeployOP.sh` (located at `/root/docker/`) looks like this
```
docker stop projectop
docker rm projectop
docker pull mydockerregistry.com/projectop
docker run -d -p 10401:3000 --name projectop mydockerregistry.com/projectop:latest
```

To compile both projects and deploy it, a third script can be used (example for windows using a bat file)
```
. (root = c:\projectop\)
|── projectop_server/
|── projectop_webclient/
|── build.bat
```

run in cmd
```
c:
cd projectop
build.bat
```

build.bat
```
cd projectop_webclient
npm run build
cd..
cd projectop_server
npm run compile
docker build -t mydockerregistry.com/projectop:latest .
docker push mydockerregistry.com/projectop:latest

ssh myserver.com /root/docker/redeployOP.sh
```

If everything is done right, you just need to run the build.bat to automatically compile, push and redeploy the new version.
Note that all games stop because projectop only lives in your server's memory. No database or persistence layer exists.


## Testing
To test the server, run
```
npm run watch
```
Then visit http://localhost:4200