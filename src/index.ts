import { initServer } from "./app";
import * as dotenv from "dotenv";


const env = dotenv.config();

async function init(){
    const app = await initServer();

    app.listen(8000, ()=>console.log(`Server started at port 8000`));
}

init();