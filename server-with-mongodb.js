import { createApp } from "./index.js";
import { ProductModel } from './models/mongo/product.js';

createApp({ productModel: ProductModel });
