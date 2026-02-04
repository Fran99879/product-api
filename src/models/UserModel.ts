
export interface UserModel {
  findByEmail(params: { email: string }): Promise<User | null>
  create(input: UserInput): Promise<User>
  findById(params: { id: string }): Promise<User | null>
}
