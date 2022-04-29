import * as shelljs from "shelljs";
import { Workspace } from "./workspace";

export function prebuild(ws: Workspace): void {
  shelljs.mv("-f", `${ws.rpath}/config_in_docker`, `${ws.rpath}/config_in_docker.previous`);
  shelljs.cp("-R", `${ws.rpath}/config`, `${ws.rpath}/config_in_docker`);
  shelljs.find(`${ws.rpath}/config_in_docker`).filter((file: string) => { return file.match(/\.origin$/); }).forEach(file => {
    shelljs.rm("-f", file);
  });
  compressAllDirectory(`${ws.rpath}/config_in_docker`);
}

function compressAllDirectory(absolutePath: string): void {
  shelljs.ls("-l", absolutePath).forEach((file: any) => {
    if (file.isDirectory()) {
      shelljs.exec(`tar -czf ${absolutePath}/${file.name}.tar.gz -C ${absolutePath}/${file.name} .`);
      compressAllDirectory(`${absolutePath}/${file.name}`);
    }
  });
}

function decompress(file: string): void {
  shelljs.exec(`tar -xzf ${file} -C ${file.split(".").slice(0, -2).join(".")} .`);
}