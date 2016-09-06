require('dotenv-safe').load()

//Blocks the thread for a specified number of milliseconds
function wait(ms){
  const start = new Date().getTime()
  let end = start
  while(end < start + ms) {
    end = new Date().getTime()
  }
}

//Wait for 3 seconds
wait(3000)
