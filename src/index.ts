import { dump } from "js-yaml";
import * as yargs from "yargs";
import { EnvMerger, ValueMaps } from "./env";
import { logger } from "./logger";
import { dencrpytResult, encrpytResult, TemplateRender, templateRender } from "./template";
import { Workspace } from "./workspace";

const process: any = {
  "g": (argv: any, ws: Workspace): void => {
    const render = new TemplateRender(ws);
    render.generate();
  },
  "gt": (argv: any, ws: Workspace): void => {
    const template = argv.template;
    logger.debug(`template args: ${template}`);
    const render = new TemplateRender(ws);
    const envMerger = new EnvMerger(ws, argv.env);
    const data = render.render(template, envMerger);
    logger.info(`result:\n\n${data.result}\n`);
    if (data.encrypted) {
      logger.info(`encryption result:\n${data.encrypted}`);
    }
  },
  "env": (argv: any, ws: Workspace): void => {
    const envMerge = new EnvMerger(ws, argv.env);
    const env = envMerge.merge(argv.env_maps?.split(","));
    console.log(dump(env, { indent: 2 }));
  },
  "demo": (argv: any, ws: Workspace): void => {},
  "build": (argv: any, ws: Workspace): void => {},
  "decrypt": (argv: any, ws: Workspace): void => {
    let salt = argv.salt;
    if (!salt) {
      const envMerge = new EnvMerger(ws, argv.env);
      salt = envMerge.salt;
      if (!salt) {
        logger.fatal(`cannot find salt at ${argv.secret}/${argv.env}(secret_path/env_path) or --salt`);
      }
    }
    const result = dencrpytResult(argv.data, salt);
    logger.info(`result:\n`);
    console.log(result);
  },
};

function main(cmd: string): any {
  return async (argv: any): Promise<any> => {
    if (!argv.workspace) {
      // 有可能是yargs
      argv = argv.argv;
    }
    logger.init(argv.verbose);
    const ws = new Workspace(argv);
    if (process[cmd]) {
      process[cmd](argv, ws);
    }
  };
}

const argv = yargs
  .option("workspace", {
    demand: true,
    alias: "w",
    default: "./",
    describe: "template workspace, default: ./",
  })
  .option("verbose", {
    demand: false,
    alias: "v",
    default: 1,
    describe: "change log level, debug: 0, info: 1, default: 1",
  })
  .option("secrets", {
    demand: false,
    alias: "s",
    describe: "specify secrets dir",
  })
  .command("g", "generate files by template", main("g"))
  .command("gt", "only generate target template with specify env to stdout for debug, gt --help for detail", (yargs: any) => {
    return yargs
      .option("template", {
        demand: true,
        describe: "target template only for gt(generate-single)",
      })
      .option("encrpyt", {
        demand: false,
        boolean: true,
        describe: "encrpyt result if secret salt file exist",
      })
      .option("env", {
        demand: true,
        alias: "e",
        describe: "specify env dir",
      })
      .help();
  }, main("gt"))
  .command("decrypt", "descrypt secret", (yargs: any) => {
    return yargs
      .option("data", {
        demand: true,
        describe: "encryption data",
      })
      .option("env", {
        demand: true,
        alias: "e",
        describe: "specify env dir",
      })
      .option("salt", {
        demand: false,
        describe: "salt for encrypt",
      })
      .help();
  }, main("decrypt"))
  .command("env", "only print merged env for debug, env --help for detail", (yargs: any) => {
    return yargs
      .option("env_maps", {
        demand: false,
        describe: "specify env merge order, split by `,`",
      })
      .option("env", {
        demand: true,
        alias: "e",
        describe: "specify env dir",
      })
      .help();
  }, main("env"))
  .command("build", "build config web server docker image", (yargs: any) => {
    return yargs
      .option("tag", {
        demand: true,
        describe: "image tag",
      })
      .help();
  }, main("build"))
  .command("init", "init demo repo", main("init"))
  .argv;