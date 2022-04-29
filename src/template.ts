import { logger } from "./logger";
import * as nunjucks from "nunjucks";
import * as crypto from "crypto";
import { dump } from "js-yaml";
import { Workspace } from "./workspace";
import { EnvMerger, ValueMaps } from "./env";
import * as shelljs from "shelljs";
import * as fs from "fs";

export type RenderOptions = {
  removeEmptyLine: boolean,
};

export function templateRender(templatePath: string, values: any, options?: RenderOptions): string {
  logger.info(`template path: ${templatePath}`);
  logger.debug(`render values: \n${dump(values)}`);
  const render = nunjucks.configure(".", {
    autoescape: false,
    trimBlocks: true,
    lstripBlocks: true,
    noCache: true,
  });
  render.addFilter("toYaml", (data: any, indent: number = 0): string => {
    const s = dump(data, {
      indent: indent,
    });
    return "\n" + s.split("\n").map(data => `${" ".repeat(indent)}${data}`).join("\n");
  });
  const result = render.render(templatePath, values);
  if (result && result.length > 0 && options && options.removeEmptyLine) {
    return result.split("\n").filter(line => { return line.trim().length > 0; }).join("\n") + "\n";
  }
  return result;
}

export function encrpytResult(origin: string, salt: string): string {
  const nonce = Buffer.alloc(12, 0xff);
  salt = salt.length >= 32 ? salt.slice(0, 32) : salt.concat("0".repeat(32 - salt.length));
  const keyHex = Buffer.from(salt);
  const cipher = crypto.createCipheriv("chacha20-poly1305", keyHex, nonce, { authTagLength: 16 });
  let c = cipher.update(origin, "utf8", "base64");
  c += cipher.final("base64");
  return c;
}

export function dencrpytResult(origin: string, salt: string): string {
  salt = salt.length >= 32 ? salt.slice(0, 32) : salt.concat("0".repeat(32 - salt.length));
  const keyHex = Buffer.from(salt);
  const nonce = Buffer.alloc(12, 0xff);
  const cipher = crypto.createDecipheriv("chacha20-poly1305", keyHex, nonce, { authTagLength: 16 });
  let c = cipher.update(origin, "base64", "utf8");
  c += cipher.final("utf8");
  return c;
}

export class TemplateRender {

  private readonly ws: Workspace;

  public constructor(ws: Workspace) {
    this.ws = ws;
  }

  public generate(): void {
    logger.debug(`start generate`);
    this.prepare();
    const envMergers = shelljs.ls(this.ws.envpath).map(env => {
      return new EnvMerger(this.ws, env);
    });
    logger.info(`envs: ${envMergers.map(item => item.env).join(",")}`);
    shelljs.find(this.ws.templateFolderPath)
      .filter(file => { return file.match(/\.j2$/); })
      .forEach(templatePath => {
        envMergers.forEach(envMerger => {
          const from = templatePath.substring(`${this.ws.rpath}/template/`.length); // 取相对路径
          const data = this.render(from, envMerger);
          this.write(from, envMerger.env, data.result, data.encrypted);
        });
      }, {} as any);
  }

  public render(from: string, envMerger: EnvMerger): any {
    const valueMaps = new ValueMaps(this.ws.templateFolderPath);
    const apps = valueMaps.parseWithTemplateFolderPath(from);
    const env = envMerger.merge(apps);
    const templatePath = `${this.ws.templateFolderPath}/${from}`;
    const result = templateRender(templatePath, env, { removeEmptyLine: false });
    logger.debug(`result:\n\n${result}`);
    let encrypted;
    if (envMerger.salt) {
      logger.debug(`find salt, need encrypt`);
      encrypted = encrpytResult(result, envMerger.salt);
      logger.debug(`encrpytion result:\n\n${encrypted}`);
    }
    return { result: result, encrypted: encrypted };
  }

  private write(from: string, env: string, result: string, encrypted?: string): void {
    const targetPath = `${this.ws.rpath}/config/${env}/${from}`.slice(0, -3);
    logger.info(`render file ${from} to ${targetPath}`);
    shelljs.mkdir("-p", targetPath.split("/").slice(0, -1).join("/"));
    if (encrypted) {
      logger.debug(`${env} content must be encrypted`);
      fs.writeFileSync(targetPath, encrypted);
      const originTargetPath = `${this.ws.rpath}/config/${env}/${from}`.slice(0, -3) + ".origin";
      fs.writeFileSync(originTargetPath, result);
    } else {
      fs.writeFileSync(targetPath, result);
    }
  }

  private prepare(): void {
    const source = `${this.ws.rpath}/config`;
    const target = `${this.ws.rpath}/config.previous`;
    logger.info(`move previous config ${source} to ${target}`);
    shelljs.mv("-f", source, target);
  }
}


