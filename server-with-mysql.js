import { createApp } from "./index.js";
import { ProductModel } from './models/mysql/product.js';

createApp({ productModel: ProductModel });
