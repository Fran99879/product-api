export const validateSchema = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.issues.map(issue => ({
        field: issue.path[0],
        message: issue.message
      }))
    })
  }

  next()
}
