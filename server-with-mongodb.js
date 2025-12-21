import { createApp } from "./index.js";
import { ProductModel } from './models/mongo/product/product.js';


createApp({ productModel: ProductModel });
