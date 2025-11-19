<?php

namespace App\Exceptions;

use Exception;
use Symfony\Component\HttpFoundation\Response;

class InventoryNotFoundException extends Exception
{
    protected $message = 'Inventory item not found';
    protected $code = Response::HTTP_NOT_FOUND;
}
