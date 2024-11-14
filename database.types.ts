import type { MergeDeep } from "type-fest";
import type { Database as DatabaseGenerated, Json } from "./database.generated.types";

export type {
  Enums,
  Json,
  TablesInsert,
  TablesUpdate,
} from "./database.generated.types";


type Override<T, U> = {
  [P in keyof T]: P extends keyof U ? U[P] : T[P];
};

// Override the type for a specific column in a view:
export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Tables: {};
      Views: {};
      Functions: {};
    };
  }
>;
