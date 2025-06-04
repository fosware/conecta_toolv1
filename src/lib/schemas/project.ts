import { z } from "zod";

export const ProjectSchema = z.object({
  id: z.number(),
  projectRequestId: z.number(),
  projectStatusId: z.number(),
  projectRequestCompanyId: z.number(),
  observations: z.string().nullable(),
  isDeleted: z.boolean().default(false),
  dateDeleted: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.number(),
});

export const ProjectWithRelationsSchema = ProjectSchema.extend({
  user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }).nullable(),
  ProjectStatus: z.object({
    id: z.number(),
    name: z.string(),
    color: z.string().nullable(),
  }),
  ProjectRequestCompany: z.object({
    id: z.number(),
    companyId: z.number(),
    Company: z.object({
      id: z.number(),
      name: z.string(),
      logo: z.string().nullable(),
      comercialName: z.string().nullable().optional(),
    }),
  }),
});

export type Project = z.infer<typeof ProjectSchema>;
export type ProjectWithRelations = z.infer<typeof ProjectWithRelationsSchema>;
