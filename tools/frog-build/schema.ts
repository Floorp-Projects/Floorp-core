import type { FromSchema } from "json-schema-to-ts";

const buildSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $comment: "You should change /tools/frog-build/main.ts because it's not importing this file",
  title: "Frog Build Tools build script schema",
  type: "object",
  properties: {
    $schema: {
      type: "string",
    },
    build: {
      type: "object",
      properties: {
        subprojects: {
          type: "array",
          description: "sub build.frog.jsonc paths",
          items: {
            type: "string",
          },
        },
        jarmanifest: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Frog's jar.frog.jsonc files",
        },
      },
      additionalProperties: false,
    },
    mozilla: {
      type: "object",
      properties: {
        xpcom_manifests: {
          type: "array",
          items: {
            type: "string",
          },
        },

        extra_js_modules: {
          type: "object",
          properties: {
            $default: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          patternProperties: {
            "$.+$": { type: "array", items: { type: "string" } },
          },
        },
        jar_manifest: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Mozilla's jar.mn files",
        },
      },
      additionalProperties: false,
    },
  },
  required: ["mozilla"],
  additionalProperties: false,
} as const;

const jarSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $comment: "You should change /tools/frog-build/main.ts because it's not importing this file",
  title: "Frog Build Tools jar manifest schema",
  type: "object",
  properties: {
    $schema: {
      type: "string",
    },
    jars: {
      type: "array",
      items: {
        type: "object",
        properties: {
          jarname: {
            type: "string",
          },
          chrome: {
            type: "object",
            properties: {
              content: {
                type: "array",
                examples: [["floorp", "%res/floorp", ["contentaccessible=yes"]]],

                items: [
                  {
                    type: "string",
                    description: "pkgname",
                  },
                  {
                    type: "string",
                    description: "uri",
                  },
                  {
                    type: "array",
                    description: "flags",
                    items: {
                      type: "string",
                      description: "flags",
                    },
                  },
                ],
              },
            },
            maxProperties: 1,
            description: "https://firefox-source-docs.mozilla.org/build/buildsystem/chrome-registration.html#chrome-registration",
            additionalProperties: false,
          },
          pathPrefix: {
            type: "string",
            description: "In jar.mn, the pathPrefix is applied to all virtual file path",
          },
          include_map: {
            type: "boolean",
            default: true,
            description: "include map file(*.map) of content files if there is",
          },
          content: {
            type: "object",
            properties: {
              normal: {
                type: "object",
                patternProperties: {
                  "^.+$": {
                    type: "object",
                    properties: { path: { type: "string" } },
                    additionalProperties: false,
                  },
                },
              },
              preprocess: {
                type: "object",
                patternProperties: {
                  "$.+$": {
                    type: "object",
                    properties: { path: { type: "string" } },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    },
  },
  required: ["jars"],
  additionalProperties: false,
} as const;

export type BuildSchema = FromSchema<typeof buildSchema>;
export type JarSchema = FromSchema<typeof jarSchema>;
