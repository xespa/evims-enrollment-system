<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Awards\DetermineAcademicAwards;
use App\Actions\Awards\GenerateAwardList;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexAwardRequest;
use Symfony\Component\HttpFoundation\Response;

/**
 * The printable list of awardees, with the page's grade level and award
 * filters. Only students receiving a recognition are printed.
 */
class AwardListPrintController extends Controller
{
    public function __invoke(IndexAwardRequest $request, DetermineAcademicAwards $determineAcademicAwards, GenerateAwardList $generateAwardList): Response
    {
        $schoolYear = $request->schoolYear();
        $recognition = in_array($request->recognition(), [IndexAwardRequest::NOT_QUALIFIED, IndexAwardRequest::INCOMPLETE, IndexAwardRequest::EVERYONE], true)
            ? IndexAwardRequest::RECOGNIZED
            : $request->recognition();

        $gradeLevels = AwardController::onlyMatching(
            $determineAcademicAwards->handle($schoolYear, $request->gradeLevelId()),
            $recognition,
        );

        return $generateAwardList->handle($schoolYear, $gradeLevels)->stream($generateAwardList->filename($schoolYear));
    }
}
