import { router, protectedProcedure } from "../index";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@agentic-company-researcher/db";

export const accountPlanRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // Fetch all account plans for this user from database
    const plans = await prisma.accountPlan.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        company: true,
        session: true,
        sections: { orderBy: { order: "asc" } },
      },
    });
    return plans;
  }),

  get: protectedProcedure
    .input(z.object({ planId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Fetch plan and verify user owns it
      const plan = await prisma.accountPlan.findUnique({
        where: { id: input.planId },
        include: {
          company: true,
          session: true,
          sections: { orderBy: { order: "asc" } },
        },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      if (plan.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to access this plan",
        });
      }

      return plan;
    }),

  create: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        sessionId: z.string(),
        title: z.string(),
        sections: z.array(z.object({ title: z.string(), content: z.string() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the session belongs to the user
      const session = await prisma.researchSession.findUnique({
        where: { id: input.sessionId },
      });

      if (!session || session.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You don't have permission to create a plan for this session",
        });
      }

      // Create plan with sections
      const plan = await prisma.accountPlan.create({
        data: {
          userId: ctx.session.user.id,
          companyId: input.companyId,
          sessionId: input.sessionId,
          title: input.title,
          sections: {
            create: input.sections.map((section, index) => ({
              title: section.title,
              content: section.content,
              order: index,
            })),
          },
        },
        include: {
          company: true,
          session: true,
          sections: { orderBy: { order: "asc" } },
        },
      });

      return plan;
    }),

  update: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        title: z.string().optional(),
        sections: z
          .array(
            z.object({
              id: z.string().optional(),
              title: z.string(),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this plan
      const plan = await prisma.accountPlan.findUnique({
        where: { id: input.planId },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      if (plan.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this plan",
        });
      }

      // Update plan
      const updatedPlan = await prisma.accountPlan.update({
        where: { id: input.planId },
        data: {
          title: input.title,
          updatedAt: new Date(),
          // Update sections if provided
          ...(input.sections && {
            sections: {
              deleteMany: {}, // Delete all existing sections
              create: input.sections.map((section, index) => ({
                title: section.title,
                content: section.content,
                order: index,
              })),
            },
          }),
        },
        include: {
          company: true,
          session: true,
          sections: { orderBy: { order: "asc" } },
        },
      });

      return updatedPlan;
    }),

  delete: protectedProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this plan
      const plan = await prisma.accountPlan.findUnique({
        where: { id: input.planId },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      if (plan.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this plan",
        });
      }

      // Delete plan (sections cascade delete automatically)
      await prisma.accountPlan.delete({
        where: { id: input.planId },
      });

      return { success: true };
    }),

  export: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        format: z.enum(["json", "markdown", "html"]),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user owns this plan
      const plan = await prisma.accountPlan.findUnique({
        where: { id: input.planId },
        include: {
          sections: { orderBy: { order: "asc" } },
          company: true,
        },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      if (plan.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to access this plan",
        });
      }

      // Format the plan data based on requested format
      let formattedData: string;

      switch (input.format) {
        case "json":
          formattedData = JSON.stringify(plan, null, 2);
          break;

        case "markdown":
          formattedData = formatAsMarkdown(plan);
          break;

        case "html":
          formattedData = formatAsHtml(plan);
          break;

        default:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid export format",
          });
      }

      return {
        data: formattedData,
        filename: `plan-${plan.id}-${new Date().toISOString().split("T")[0]}`,
        contentType: getContentType(input.format),
      };
    }),
});

// Helper function to format plan as Markdown
function formatAsMarkdown(plan: any): string {
  let markdown = `# ${plan.title || "Account Plan"}\n\n`;

  markdown += `**Company:** ${plan.company?.name || "N/A"}\n`;
  markdown += `**Created:** ${new Date(plan.createdAt).toLocaleDateString()}\n`;
  markdown += `**Last Updated:** ${new Date(
    plan.updatedAt
  ).toLocaleDateString()}\n\n`;

  markdown += `---\n\n`;

  if (plan.sections && plan.sections.length > 0) {
    plan.sections.forEach((section: any, index: number) => {
      markdown += `## ${section.title || `Section ${index + 1}`}\n\n`;
      markdown += `${section.content}\n\n`;
    });
  } else {
    markdown += `No sections in this plan.\n`;
  }

  return markdown;
}

// Helper function to format plan as HTML
function formatAsHtml(plan: any): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${plan.title || "Account Plan"}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #333; }
    h2 { color: #555; margin-top: 20px; }
    .metadata { color: #666; font-size: 14px; margin-bottom: 20px; }
    .section { margin-bottom: 30px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #007bff; }
  </style>
</head>
<body>
  <h1>${plan.title || "Account Plan"}</h1>
  <div class="metadata">
    <p><strong>Company:</strong> ${plan.company?.name || "N/A"}</p>
    <p><strong>Created:</strong> ${new Date(
      plan.createdAt
    ).toLocaleDateString()}</p>
    <p><strong>Last Updated:</strong> ${new Date(
      plan.updatedAt
    ).toLocaleDateString()}</p>
  </div>
  <hr>`;

  if (plan.sections && plan.sections.length > 0) {
    plan.sections.forEach((section: any, index: number) => {
      html += `<div class="section">
    <h2>${section.title || `Section ${index + 1}`}</h2>
    <p>${section.content}</p>
  </div>`;
    });
  } else {
    html += `<p>No sections in this plan.</p>`;
  }

  html += `</body>
</html>`;

  return html;
}

// Helper function to get content type
function getContentType(format: string): string {
  switch (format) {
    case "json":
      return "application/json";
    case "markdown":
      return "text/markdown";
    case "html":
      return "text/html";
    default:
      return "text/plain";
  }
}
