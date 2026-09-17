import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export class Css {
  static merge(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
  }
}
