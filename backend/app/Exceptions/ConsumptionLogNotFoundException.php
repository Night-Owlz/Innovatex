<?php

namespace App\Exceptions;

use Exception;
use Symfony\Component\HttpFoundation\Response;

class ConsumptionLogNotFoundException extends Exception
{
    protected $message = 'Consumption log not found';
    protected $code = Response::HTTP_NOT_FOUND;
}
