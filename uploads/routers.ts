import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from 'zod';
import {
  calculateExpectedValue,
  runMarkovCohortSimulation,
  runOneWaySensitivity,
  buildNodeTargets,
} from './analysisEngine';
import type { GraphModel, EVResult, TornadoResult } from '@shared/analysisTypes';

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Analysis router for decision tree and Markov models
  analysis: router({
    rollback: publicProcedure
      .input(
        z.object({
          model: z.any(),
          variables: z.record(z.string(), z.number()),
        })
      )
      .mutation(async ({ input }): Promise<EVResult> => {
        const { model, variables } = input as { model: GraphModel; variables: Record<string, number> };
        
        // Find root node (node with no incoming edges)
        const sourceIds = new Set(model.edges.map((edge) => edge.target));
        const rootNode = model.nodes.find((node) => !sourceIds.has(node.id));
        
        if (!rootNode) {
          throw new Error('No root node found');
        }
        
        // Build node targets from edges
        buildNodeTargets(model);
        
        // Run appropriate analysis
        if (rootNode.data.nodeType === 'markov') {
          return runMarkovCohortSimulation(model, rootNode.id, variables);
        } else {
          return calculateExpectedValue(model, rootNode.id, variables);
        }
      }),
    
    sensitivityOneWay: publicProcedure
      .input(
        z.object({
          model: z.any(),
          variables: z.record(z.string(), z.number()),
        })
      )
      .mutation(async ({ input }): Promise<TornadoResult> => {
        const { model, variables } = input as { model: GraphModel; variables: Record<string, number> };
        
        // Find root node
        const sourceIds = new Set(model.edges.map((edge) => edge.target));
        const rootNode = model.nodes.find((node) => !sourceIds.has(node.id));
        
        if (!rootNode) {
          throw new Error('No root node found');
        }
        
        // Build node targets from edges
        buildNodeTargets(model);
        
        // Create sensitivity parameters (±20% variation)
        const paramsToTest = Object.entries(variables).map(([name, value]) => ({
          variable_name: name,
          low: value * 0.8,
          high: value * 1.2,
        }));
        
        return runOneWaySensitivity(model, rootNode.id, variables, paramsToTest);
      }),
  }),
});

export type AppRouter = typeof appRouter;
