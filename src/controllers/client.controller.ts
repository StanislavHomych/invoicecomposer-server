import { Request, Response, NextFunction } from 'express';
import * as clientService from '../services/client.service';
import { clientSchema } from '../validators/client.validator';

export async function getClients(req: Request, res: Response, next: NextFunction) {
  try {
    const clients = await clientService.getClientsByUserId(req.user!.id);
    res.json(clients);
  } catch (error) {
    next(error);
  }
}

export async function getClient(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await clientService.getClientById(req.params.id, req.user!.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    next(error);
  }
}

export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('Creating client with data:', JSON.stringify(req.body, null, 2));
    const data = clientSchema.parse(req.body);
    console.log('Parsed data:', JSON.stringify(data, null, 2));
    const client = await clientService.createClient(req.user!.id, data);
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    next(error);
  }
}

export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const data = clientSchema.partial().parse(req.body);
    const result = await clientService.updateClient(req.params.id, req.user!.id, data);
    if (result.count === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    const client = await clientService.getClientById(req.params.id, req.user!.id);
    res.json(client);
  } catch (error) {
    next(error);
  }
}

export async function deleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await clientService.deleteClient(req.params.id, req.user!.id);
    if (result.count === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    next(error);
  }
}
