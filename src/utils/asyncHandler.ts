import type { Request, Response, NextFunction } from 'express'

type AsyncController<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction
) => Promise<unknown>

export const asyncHandler =
  <Req extends Request = Request>(fn: AsyncController<Req>) =>
  (req: Req, res: Response, next: NextFunction): void => {
    void Promise.resolve(fn(req, res, next)).catch(next)
  }
