import { router, publicProcedure } from "../index";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@agentic-company-researcher/db";

export const companyRouter = router({
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      // Public search - no auth required
      // Search for companies in database
      try {
        const companies = await prisma.company.findMany({
          where: {
            OR: [
              { name: { contains: input.query, mode: "insensitive" } },
              { description: { contains: input.query, mode: "insensitive" } },
              { industry: { contains: input.query, mode: "insensitive" } },
            ],
          },
          take: 10,
          select: {
            id: true,
            name: true,
            description: true,
            industry: true,
            website: true,
          },
        });
        return companies;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to search companies",
        });
      }
    }),

  get: publicProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ input }) => {
      // Public company details - no auth required
      // Fetch company details from database
      try {
        const company = await prisma.company.findUnique({
          where: { id: input.companyId },
          include: {
            researchFindings: {
              take: 5,
              orderBy: { createdAt: "desc" },
            },
          },
        });

        if (!company) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Company not found",
          });
        }

        return company;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch company details",
        });
      }
    }),

  getProfile: publicProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ input }) => {
      // Public company profile - no auth required
      // Fetch detailed company profile
      try {
        const company = await prisma.company.findUnique({
          where: { id: input.companyId },
          include: {
            researchFindings: { orderBy: { createdAt: "desc" } },
            accountPlans: {
              include: { sections: { orderBy: { order: "asc" } } },
            },
          },
        });

        if (!company) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Company not found",
          });
        }

        return {
          id: company.id,
          name: company.name,
          description: company.description,
          industry: company.industry,
          website: company.website,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
          findingsCount: company.researchFindings.length,
          plansCount: company.accountPlans.length,
          findings: company.researchFindings.slice(0, 10),
          plans: company.accountPlans.slice(0, 5),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch company profile",
        });
      }
    }),
});
