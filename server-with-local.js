import { createApp } from "./index.js";
import { ProductModel } from './models/local-file-system/product.js';

createApp({ productModel: ProductModel });
